<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
    <header>
        <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="40" height="40" />
        <div class="wrapper">
            <!-- <HelloWorld msg="You did it!" /> -->
            <nav>
                <RouterLink to='/'>Home</RouterLink>
                <RouterLink to='/about'>About</RouterLink>
            </nav>
        </div>
    </header>
    <div class="content">
        <hr>
        <RouterView />
    </div>
</template>

<style scoped>
header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 1rem;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: white;
}

.content {
    /* Adjust this value based on the height of your header */
    padding: 1rem;
    width: 100%;
    position: fixed;
    left: 0;
    top: 40px;
    width: 100%;
}

.logo {
    margin-right: 1rem;
}

.wrapper {
    display: flex;
    align-items: center;
}

nav {
    display: flex;
    gap: 1rem;
}

nav a.router-link-exact-active {
    color: var(--color-text);
}

nav a.router-link-exact-active:hover {
    background-color: transparent;
}

nav a {
    text-decoration: none;
    /* color: inherit; */
    padding: 0.5rem 1rem;
    border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
    border-left: none;
}

@media (min-width: 1024px) {
    header {
        padding-right: calc(var(--section-gap) / 2);
    }
    .logo {
        margin-right: 2rem;
    }
    nav {
        font-size: 1.1rem;
    }
}
</style>