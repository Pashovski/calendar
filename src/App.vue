<script setup lang="ts">
import { ref } from 'vue'
import HomeView from '@/components/HomeView.vue'
import CalendarView from '@/components/CalendarView.vue'

const view = ref<'home' | 'calendar'>('home')
</script>

<template>
  <HomeView v-if="view === 'home'" @show-calendar="view = 'calendar'" />
  <CalendarView v-else @back="view = 'home'" />
</template>
