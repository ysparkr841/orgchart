import type { TreeNode } from "@/lib/tree/builder";

function ind(n: number): string {
  return "  ".repeat(n);
}

function nodeToJs(node: TreeNode, depth: number): string {
  const i = ind(depth);
  const childrenStr =
    node.children.length === 0
      ? "[]"
      : `[\n${node.children.map((c) => nodeToJs(c, depth + 1)).join(",\n")},\n${i}]`;
  return [
    `${i}{`,
    `${i}  id: ${JSON.stringify(node.id)},`,
    `${i}  title: ${JSON.stringify(node.title)},`,
    `${i}  name: ${JSON.stringify(node.name ?? "")},`,
    `${i}  children: ${childrenStr},`,
    `${i}}`,
  ].join("\n");
}

function serializeData(roots: TreeNode[]): string {
  if (roots.length === 0) return "";
  return roots.map((r) => nodeToJs(r, 1)).join(",\n");
}

export function generateReactCode(roots: TreeNode[]): string {
  const data = serializeData(roots);
  return `import React from 'react';

interface OrgNode {
  id: string;
  title: string;
  name: string;
  children: OrgNode[];
}

const ORG_DATA: OrgNode[] = [
${data}
];

function OrgNodeCard({ node }: { node: OrgNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '8px 16px',
          background: 'white',
          textAlign: 'center',
          minWidth: '120px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{node.title}</div>
        {node.name && (
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{node.name}</div>
        )}
      </div>
      {node.children.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          {node.children.map((child) => (
            <OrgNodeCard key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '32px', justifyContent: 'center' }}>
        {ORG_DATA.map((root) => (
          <OrgNodeCard key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}
`;
}

export function generateVueCode(roots: TreeNode[]): string {
  const data = serializeData(roots);
  return `<!-- OrgChart.vue -->
<template>
  <div class="org-chart">
    <org-node-card v-for="root in orgData" :key="root.id" :node="root" />
  </div>
</template>

<script>
const orgData = [
${data}
];

const OrgNodeCard = {
  name: 'OrgNodeCard',
  props: { node: { type: Object, required: true } },
  components: {},
  template: \`
    <div class="node-wrapper">
      <div class="node-card">
        <div class="node-title">{{ node.title }}</div>
        <div v-if="node.name" class="node-name">{{ node.name }}</div>
      </div>
      <div v-if="node.children && node.children.length" class="node-children">
        <org-node-card v-for="child in node.children" :key="child.id" :node="child" />
      </div>
    </div>
  \`,
};
OrgNodeCard.components = { OrgNodeCard };

export default {
  components: { OrgNodeCard },
  data() {
    return { orgData };
  },
};
</script>

<style scoped>
.org-chart {
  padding: 32px;
  background: #f8fafc;
  min-height: 100vh;
  overflow-x: auto;
  display: flex;
  gap: 32px;
  justify-content: center;
}

.node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 8px;
}

.node-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  background: white;
  text-align: center;
  min-width: 120px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.node-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.node-name {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.node-children {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}
</style>
`;
}
