<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
    <div class="app-container">
      <header>
        <img alt='Vue logo' class='logo' src='@/assets/logo.svg' width='40' height='40' />
        <div class='wrapper'>
          <nav>
            <RouterLink to='/'>Home</RouterLink>
            <RouterLink to='/about'>About</RouterLink>
          </nav>
        </div>
      </header>
      <div class='content'>
        <hr>
        <RouterView />
      </div>
    </div>
  </template>
  
  <style scoped>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 1rem 0 0rem 1.5rem;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: white;
    z-index: 1000; /* Ensure the header is above other content */
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
    padding: 0.5rem 1rem;
    border-left: 1px solid var(--color-border);
  }
  
  nav a:first-of-type {
    border-left: none;
  }
  
  .content {
    margin-top: 40px; /* Adjust this value based on the height of your header */
    padding: 1rem;
    width: 100%;
    height: calc(100vh - 80px); /* Adjust this value based on the height of your header */
    box-sizing: border-box; /* Ensure padding does not affect the width */
    overflow: auto; /* Ensure content is scrollable if it overflows */
    left: 0rem;
    position: fixed;
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