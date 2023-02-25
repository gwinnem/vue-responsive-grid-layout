# Basic Drag & Resize

<template>
    <button @click="onClick">Increase</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref<number>(0);
const onClick = () => {
    count.value++
};
</script>
