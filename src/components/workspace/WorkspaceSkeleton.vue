<script setup lang="ts">
/* 验收用：加载骨架 — 与 ready 结构对齐，避免布局跳动 */
</script>

<template>
  <div class="ws sk">
    <div class="sk-head">
      <div class="sk-lines">
        <span class="sk-line w80" />
        <span class="sk-line w160" />
        <span class="sk-line w240" />
      </div>
      <span class="sk-btn" />
    </div>

    <div class="sk-metrics">
      <div v-for="i in 4" :key="i" class="sk-card">
        <span class="sk-line w72" />
        <span class="sk-line w120 h28" />
        <span class="sk-line w72" />
      </div>
    </div>

    <div class="sk-card tall">
      <span class="sk-line w72" />
      <span class="sk-line full h64" />
    </div>

    <div class="sk-grid">
      <div class="sk-card tall">
        <span class="sk-line w72" />
        <span class="sk-line full h56" />
        <span class="sk-line full h56" />
      </div>
      <div class="sk-card tall">
        <span class="sk-line w72" />
        <span class="sk-line full h36" />
        <span class="sk-line full h36" />
        <span class="sk-line full h36" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws {
  padding: 28px 32px 48px;
  max-width: 1280px;
  margin: 0 auto;
}
.sk-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 22px;
}
.sk-lines,
.sk-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sk-btn {
  width: 140px;
  height: 44px;
  border-radius: var(--r-pill);
}
.sk-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.sk-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
.sk-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  padding: 20px;
}
.sk-card.tall {
  min-height: 220px;
  margin-bottom: 0;
}
.sk-line {
  display: block;
  height: 14px;
  border-radius: 7px;
}
.sk-line.w72 { width: 72px; }
.sk-line.w80 { width: 80px; }
.sk-line.w120 { width: 120px; height: 28px; }
.sk-line.w160 { width: 160px; height: 32px; }
.sk-line.w240 { width: 240px; height: 16px; }
.sk-line.full { width: 100%; }
.sk-line.h28 { height: 28px; }
.sk-line.h36 { height: 36px; }
.sk-line.h56 { height: 56px; }
.sk-line.h64 { height: 64px; }

.sk-line,
.sk-btn {
  background: linear-gradient(90deg, #eef0f3 25%, #f7f8fa 50%, #eef0f3 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1100px) {
  .sk-metrics { grid-template-columns: repeat(2, 1fr); }
  .sk-grid { grid-template-columns: 1fr; }
}
</style>
