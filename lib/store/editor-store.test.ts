import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editor-store";
import type { TreeNode } from "@/lib/tree/builder";

function node(
  id: string,
  title: string,
  children: TreeNode[] = [],
): TreeNode {
  return { id, title, name: title, order: 0, children };
}

const CEO = () =>
  node("ceo", "CEO", [node("cto", "CTO", [node("dev", "Dev")]), node("cfo", "CFO")]);

beforeEach(() => {
  useEditorStore.setState({ roots: [], projectId: null, isDirty: false });
});

describe("setRoots", () => {
  it("roots와 projectId를 설정하고 isDirty를 false로 초기화한다", () => {
    const roots = [CEO()];
    useEditorStore.getState().setRoots(roots, "proj-1");
    const s = useEditorStore.getState();
    expect(s.roots).toEqual(roots);
    expect(s.projectId).toBe("proj-1");
    expect(s.isDirty).toBe(false);
  });

  it("projectId를 생략하면 null이 된다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    expect(useEditorStore.getState().projectId).toBeNull();
  });

  it("이전에 dirty 상태였더라도 setRoots 후 isDirty는 false다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    useEditorStore.getState().addNode(null, node("b", "B"));
    expect(useEditorStore.getState().isDirty).toBe(true);
    useEditorStore.getState().setRoots([node("c", "C")]);
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});

describe("addNode", () => {
  it("parentId가 null이면 루트 레벨에 추가한다", () => {
    useEditorStore.getState().addNode(null, node("a", "A"));
    useEditorStore.getState().addNode(null, node("b", "B"));
    const { roots } = useEditorStore.getState();
    expect(roots).toHaveLength(2);
    expect(roots[0].id).toBe("a");
    expect(roots[1].id).toBe("b");
  });

  it("특정 부모 아래에 자식을 추가한다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().addNode("cto", node("qa", "QA"));
    const cto = useEditorStore.getState().roots[0].children[0];
    expect(cto.children).toHaveLength(2);
    expect(cto.children[1].id).toBe("qa");
  });

  it("addNode 후 isDirty가 true가 된다", () => {
    useEditorStore.getState().addNode(null, node("x", "X"));
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("중첩된 노드의 자식으로 추가할 수 있다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().addNode("dev", node("fe", "FE"));
    const dev = useEditorStore
      .getState()
      .roots[0].children[0].children[0];
    expect(dev.children).toHaveLength(1);
    expect(dev.children[0].id).toBe("fe");
  });
});

describe("deleteNode", () => {
  it("루트 노드를 삭제한다", () => {
    useEditorStore.getState().setRoots([node("a", "A"), node("b", "B")]);
    useEditorStore.getState().deleteNode("a");
    const { roots } = useEditorStore.getState();
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe("b");
  });

  it("중첩된 노드를 삭제한다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().deleteNode("cto");
    const { roots } = useEditorStore.getState();
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].id).toBe("cfo");
  });

  it("자식을 포함한 서브트리 전체가 삭제된다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().deleteNode("ceo");
    expect(useEditorStore.getState().roots).toHaveLength(0);
  });

  it("deleteNode 후 isDirty가 true가 된다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    useEditorStore.getState().deleteNode("a");
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("존재하지 않는 ID를 삭제해도 트리가 변하지 않는다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    useEditorStore.getState().deleteNode("zzz");
    expect(useEditorStore.getState().roots).toHaveLength(1);
  });
});

describe("updateNode", () => {
  it("루트 노드의 title을 수정한다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().updateNode("ceo", { title: "사장" });
    expect(useEditorStore.getState().roots[0].title).toBe("사장");
  });

  it("중첩된 노드의 name을 수정한다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().updateNode("dev", { name: "홍길동" });
    const dev = useEditorStore.getState().roots[0].children[0].children[0];
    expect(dev.name).toBe("홍길동");
  });

  it("avatarUrl과 color를 동시에 수정할 수 있다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    useEditorStore
      .getState()
      .updateNode("a", { avatarUrl: "https://example.com/img.png", color: "#ff0000" });
    const a = useEditorStore.getState().roots[0];
    expect(a.avatarUrl).toBe("https://example.com/img.png");
    expect(a.color).toBe("#ff0000");
  });

  it("updateNode 후 isDirty가 true가 된다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    useEditorStore.getState().updateNode("a", { title: "B" });
    expect(useEditorStore.getState().isDirty).toBe(true);
  });
});

describe("moveNode", () => {
  it("노드를 다른 부모 아래로 이동한다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    // CFO를 CTO 아래로 이동
    useEditorStore.getState().moveNode("cfo", "cto");
    const cto = useEditorStore.getState().roots[0].children[0];
    expect(cto.children).toHaveLength(2);
    expect(cto.children[1].id).toBe("cfo");
    // CEO의 직속 자식에서 제거됐는지 확인
    expect(useEditorStore.getState().roots[0].children).toHaveLength(1);
  });

  it("노드를 루트 레벨로 이동한다 (newParentId = null)", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().moveNode("cto", null);
    const { roots } = useEditorStore.getState();
    expect(roots).toHaveLength(2);
    expect(roots[1].id).toBe("cto");
    expect(roots[0].children).toHaveLength(1); // CEO 아래에 CFO만 남음
  });

  it("moveNode 후 isDirty가 true가 된다", () => {
    useEditorStore.getState().setRoots([CEO()]);
    useEditorStore.getState().moveNode("cfo", "cto");
    expect(useEditorStore.getState().isDirty).toBe(true);
  });
});

describe("markSaved", () => {
  it("projectId를 업데이트하고 isDirty를 false로 만든다", () => {
    useEditorStore.getState().setRoots([node("a", "A")]);
    useEditorStore.getState().addNode(null, node("b", "B"));
    expect(useEditorStore.getState().isDirty).toBe(true);
    useEditorStore.getState().markSaved("saved-proj");
    const s = useEditorStore.getState();
    expect(s.isDirty).toBe(false);
    expect(s.projectId).toBe("saved-proj");
  });
});
