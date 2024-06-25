<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, watch, nextTick } from "vue";
import { Preview }from "./index";
import { useLeither, useMimei, useSpinner } from '../stores/lapi'
const api = useLeither();
const mmInfo = useMimei();
class FileInfo{
  name; lastModified; size; type; caption; mid;
  constructor(name: string, lastModified: number, size: number, type: string, caption:string="") {
    this.name = name;
    this.lastModified = lastModified;
    this.size = size;
    this.type = type;
    this.caption = caption;   // Displayed in File List view
    this.mid = "";            // ipfs id if a media file, otherwise a mid id.
  }
}
class ScorePair {
  score: number;
  member: string;
  constructor(score: number, member: string) {
    this.score = score;
    this.member = member;
  }
}
interface HTMLInputEvent extends Event { target: HTMLInputElement & EventTarget }
const emit = defineEmits(["uploaded", "hide"])
const inpCaption = ref()
const textValue = ref("")
const caption = ref<HTMLFormElement>();
const divAttach = ref()
const dropHere = ref()
const textArea = ref<HTMLTextAreaElement>()
const sliceSize = 1024 * 1024 * 10    // 10MB per slice of file
const filesUpload = ref<File[]>([]);
const uploadProgress = reactive<number[]>([]); // New ref to store upload progress of each file

const props = defineProps({
    // text : {type: String, required: false},       // text input from editor
    // attachments: {type: [File], required: false},
    display: {type: String, required: false, default:"block"},
    column: {type: String, required: true}    // column title
})

onMounted(async () => {
  console.log("Editor mount", props)
})
watch(()=>props.display, (nv, ov)=>{
  if (nv!=ov && nv == 'block') {
    // focus() was called before textArea was rendered. Use nextTick() to fix it.
    nextTick(()=>{
      textArea.value?.focus()
    })
  }
})
async function onSelect(e: Event) {
  const files = (e as HTMLInputEvent).target.files || (e as DragEvent).dataTransfer?.files || (e as ClipboardEvent).clipboardData?.files;
  if (files?.length! > 0) {
    Array.from(files!).forEach(f => {
      if (filesUpload.value.findIndex((e:File) => {return e.size === f.size && e.name === f.name }) === -1) {
        // remove duplication
        if (!inpCaption.value || inpCaption.value.trim() === "") {
          inpCaption.value = f.name
        }
        filesUpload.value.push(f);
      }
    })
    divAttach.value!.hidden = false
    textArea.value!.hidden = false
    dropHere.value!.hidden = true
  } else {
    // clipboard works only with HTTPS
    // const t = await navigator.clipboard.readText()
    if ((e.target as HTMLTextAreaElement) === textArea.value) {
      // paste into text area
      document.execCommand('paste')
    } else if ((e.target as HTMLFormElement) === caption.value) {
      // paste into caption
      document.execCommand("paste")
    }
  }
}
function dragOver() {
  textArea!.value!.hidden = true
  dropHere!.value!.hidden = false
}
function selectFile() {
  document.getElementById("selectFiles")?.click();
}
// Function to upload files and store them as IPFS or Mimei type
async function uploadFile(files: File[]): Promise<PromiseSettledResult<FileInfo>[]> {
  // Helper function to handle individual file uploads
  async function uploadSingleFile(file: File, index: number): Promise<FileInfo> {
    // Check if the file size exceeds the limit (200MB in this example)
    if (file.size > sliceSize * 30) {
      throw new Error("Max file size exceeded");
    }
    // Assign initial progress value
    uploadProgress[index] = 0;
    // Create a temporary file
    const fsid = await api.client.MFOpenTempFile(api.sid);
    // Create a FileInfo object with file name, last modified time,
    const fi = new FileInfo(file.name, file.lastModified, file.size, file.type);
    fi.mid = await readFileSlice(fsid, await file.arrayBuffer(), 0, index);   // return an IPFS id actually
    
    // Save non-media files as Mimei type, for easy download and open
    if (fi.type.search(/(image|video|audio)/i) === -1) {
      const mid = await api.client.MMCreate(api.sid, "", "", "{{auto}}", 1, 0x07276705);
      await api.client.MFSetCid(api.sid, mid, fi.mid);  // assign the ipfs id to a mid
      fi.mid = mid;
      // await api.client.MMBackup(api.sid, fi.mid, "")   // not a real mm, backup will throw error
    }
    // Add MM reference to the database mimei, which will be published together.
    console.log(fi)   // never executed when there is a timeout uploading file.
    await api.client.MMAddRef(api.sid, mmInfo.mid, fi.mid);
    return fi;
  }

  // Use Promise.allSettled to wait for all file upload operations to complete
  return Promise.allSettled(files.map((file,i) => uploadSingleFile(file, i)));
}
async function onSubmit() {
  if (!inpCaption.value || inpCaption.value!.trim() === "" || (filesUpload.value.length === 0 && textValue.value.trim() === "")) {
    // remind user to input caption
    caption.value?.focus()
    return;
  }
  useSpinner().setLoadingState(true)
  let mmsidCur = await mmInfo.mmsidCur;
  try {
    if (filesUpload.value.length) {
      // with attachments to be uploaded
      // reopen the DB mimei as cur version, for writing
      let fvPairs: FVPair[] = (await uploadFile(filesUpload.value))
        .filter(v => { return v.status === 'fulfilled'; })
        .map((v: any) => { return { field: v.value.mid, value: v.value } });  // mid as field, fileInfo as value
      
      if (!fvPairs || fvPairs.length < filesUpload.value.length) {
        // uploading files failed
        throw "Attachments uploading failed" + fvPairs.toString()
      }
      console.log("uploaded files", ...fvPairs, props.column);

      if (fvPairs.length === 1 && textValue.value.trim() === "") {
        // single file uploaded without text input
        // now save {mid, fileInfo} as FV pair and bakcup mm DB
        // so FileInfo can be found by its mid.
        fvPairs[0].value["caption"] = inpCaption.value!.trim();
        await api.client.Hmset(mmsidCur, props.column, ...fvPairs);

        // create MM database for the column, new item is added to this MM.
        // add new itme to index table of ScorePair
        let ret = await api.client.Zadd(mmsidCur, props.column, new ScorePair(Date.now(), fvPairs[0].value["mid"]))
        console.log("Zadd ScorePair for the file, ret=", ret, props.column)
        // back mm data for publish
        await mmInfo.backup()

        // emit an event with infor of newly uploaded file
        emit('uploaded', fvPairs[0].value)
        localStorage.setItem("tempTextValueUploader", "")
        filesUpload.value = [];   // clear file list of upload
        textValue.value = ""
        inpCaption.value = ""
      } else {
        // upload a full webpage with attachments and/or content text
        // use Name field to save a string defined as: 1st item is input of textarea, followed by mids of uploaded file
        await api.client.Hmset(mmsidCur, props.column, ...fvPairs);
        await addPage(JSON.stringify([textValue.value].concat(fvPairs.map(e => e.field))))
      }
    } else {
      // no attachment
      // create a file type PAGE. use Name field to save a string defined as:
      // 1st item is input of textarea, followed by mids of uploaded file
      console.log(mmInfo.$state, api.$state)
      await addPage(JSON.stringify([textValue.value]))
    }
  } catch (err) {
    // something wrong uploading files, abort
    console.error("onSubmit err:", err)
    window.alert(err)
  } finally {
    useSpinner().setLoadingState(false)
  }

  async function addPage(s: string) {
    // create a Mimei of file type PAGE.
    let fi = new FileInfo(s, Date.now(), s.length, "page", inpCaption.value!.trim());
    fi.mid = await api.client.MMCreate(api.sid, '', '', '{{auto}}', 1, 0x07276705);
    let fsid = await api.client.MMOpen(api.sid, fi.mid, "cur")
    await api.client.MFSetObject(fsid, fi)
    // api.client.timeout = 30000;
    await api.client.MMBackup(api.sid, fi.mid, "", "delref=true")
    await api.client.MMAddRef(api.sid, mmInfo.mid, fi.mid)  // add reference to database Mimei

    // add new page file to index table
    let ret = await api.client.Hset(mmsidCur, props.column, fi.mid, fi)
    ret = await api.client.Zadd(mmsidCur, props.column, new ScorePair(Date.now(), fi.mid))
    console.log("Zadd ver=", fi, ret)

    // backup Mimei data and publish
    await mmInfo.backup()

    emit('uploaded', fi)
    localStorage.setItem("tempTextValueUploader", "")
    filesUpload.value = [];   // clear file list of upload
    textValue.value = "";
    inpCaption.value = ""
  }
}

async function readFileSlice(fsid: string, arr: ArrayBuffer, start: number, index: number):Promise<string> {
  // reading file slice by slice, start at given position
  var end = Math.min(start + sliceSize, arr.byteLength);
  let count = await api.client.MFSetData(fsid, arr.slice(start, end), start);
  // Calculate progress
  uploadProgress[index] = Math.floor((start + count) / arr.byteLength * 100);
  console.log("Uploading...", uploadProgress[index]+"%")

  if (end === arr.byteLength) {
    // last slice read. Convert temp to IPFS file
    // return temp2Ipfs(fsid);   // return a Promise, no await here
    return await api.client.MFTemp2Ipfs(fsid, mmInfo.mid)
  } else {
    return await readFileSlice(fsid, arr, start + count, index)
  }
}

function removeFile(f: File) {
  // removed file from preview list
  var i = filesUpload.value.findIndex((e:File) => e==f);
  filesUpload.value.splice(i, 1)
}

watch(() => textValue.value, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    localStorage.setItem("tempTextValueUploader", newVal)
  }
})
</script>

<template>
  <div class="modal-content" @dragover.prevent="dragOver" @drop.prevent="onSelect">
    <div class="content-wrapper">
      <div class="input-container">
        <input type="text" placeholder="Caption... required" v-model="inpCaption" ref="caption" class="input-caption">
        <textarea ref="textArea" v-model="textValue" placeholder="Input......" class="input-textarea"></textarea>
        <div ref="dropHere" hidden class="drop-here">
          <p>DROP HERE</p>
        </div>
      </div>
      <form @submit.prevent="onSubmit" enctype="multipart/form-data" @paste.prevent="onSelect" class="form-container">
        <div ref="divAttach" hidden class="preview-container">
          <Preview @file-canceled="removeFile(file)" v-for="(file, index) in filesUpload" :key="index"
            v-bind:src="file" v-bind:progress="uploadProgress[index]"></Preview>
        </div>
        <input id="selectFiles" @change="onSelect" type="file" hidden multiple>
        <div class="button-container">
          <button @click.prevent="selectFile">Choose</button>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  background-color: #ebf0f3;
  margin: 5% 10% 5% 2%;
  padding: 10px;
  border: 1px solid #888;
  height: 80vh;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.input-container {
  flex: 1;
  margin-bottom: 10px;
}

.input-caption {
  border: 0px;
  width: 100%;
  height: 30px;
  margin-bottom: 8px;
}

.input-textarea {
  margin: 5px;
  position: absolute;
  top:50px;
  left: 0;
  bottom: 60px;
  /* height: 150%; */
  border: 1px solid lightgrey;
  width: 99%;
  border-radius: 3px;
}

.drop-here {
  border: 1px solid lightgrey;
  width: 100%;
  height: 200px;
  margin: 0px;
  text-align: center;
}

.form-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 10px;
}

.preview-container {
  margin: 10px;
  position: absolute;
  left: 0;
  bottom: 50px;
  border: 0px solid lightgray;
  border-radius: 5px;
  margin-bottom: 6px;
  padding-top: 0px;
}

.button-container {
  height: auto;
  display: flex;
  justify-content: space-between;
  margin-top: auto;
}
</style>