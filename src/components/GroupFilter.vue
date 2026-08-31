<script setup>
import FlagIcon from "./FlagIcon.vue";

defineProps({
  groups: { type: Array, required: true },
  activeGroup: { type: String, default: "all" },
});
defineEmits(["select"]);
</script>

<template>
  <section class="group-bar">
    <button
      :class="{ active: activeGroup === 'all' }"
      @click="$emit('select', 'all')"
    >
      全部节点
      <i>{{ groups.reduce((sum, group) => sum + group.count, 0) }}</i></button
    ><button
      v-for="group in groups"
      :key="group.code"
      :class="{ active: activeGroup === group.code }"
      @click="$emit('select', group.code)"
    >
      <FlagIcon :code="group.code" :label="`${group.code} 节点`" />
      {{ group.code }} <i>{{ group.count }}</i>
    </button>
  </section>
</template>
