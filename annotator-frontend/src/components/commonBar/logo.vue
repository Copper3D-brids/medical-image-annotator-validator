<!-- logo.vue -->
<!--
  Logo Component

  @description Simple logo display component showing the ABI logo.
  Positioned in the bottom-right corner of the application.
-->
<template>
  <div class="logo">
    <img src="abi.png" alt="" />
  </div>
</template>

<style scoped>
.logo {
  width: 11vw;
  height: 2.1vw;
  position: fixed;
  bottom: 32px;
  right: 15px;
  z-index: 100;
}
.logo img {
  width: 100%;
  height: 100%;
}
</style>
