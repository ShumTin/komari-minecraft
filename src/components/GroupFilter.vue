<script setup>
defineProps({ groups: { type: Array, required: true } });
</script>

<template>
  <section class="group-bar"><button v-for="group in groups" :key="group.code"><span>{{ group.flag }}</span>{{ group.code }} <i>{{ group.count }}</i></button></section>
</template>
