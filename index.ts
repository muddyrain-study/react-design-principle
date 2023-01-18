interface effectType {
  execute: () => void;
  deps: Set<unknown>;
}
function useState<T>(value: T): [() => T, (newValue: T) => T] {
  // 保存订阅该 state 变化的 effect
  const subs: Set<effectType> = new Set();
  const getter: () => T = () => {
    // 获取当前上下文的 effect (最后一个)
    const effect = effectStack[effectStack.length - 1];
    if (effect) {
      // 建立订阅发布关系
      subscribe(effect, subs);
    }
    return value;
  };
  const setter: (newValue: T) => T = (newValue) => {
    value = newValue;
    // 通知所以订阅该 state 变化的 effect执行
    console.log("subs", subs);
    for (const effect of [...subs]) {
      effect.execute();
    }
    return value;
  };

  return [getter, setter];
}

const effectStack: Array<effectType> = [];
function useEffect(callback) {
  const execute = () => {
    // 重置依赖
    cleanup(effect);
    // 将当前effect推入栈顶
    effectStack.push(effect);
    try {
      // 执行回调
      callback();
    } finally {
      // effect 出栈
      effectStack.pop();
    }
  };
  const effect = {
    // 用于执行 useEffect 回调函数
    execute,
    // 保存该 useEffect 依赖的 state 对应 subs 的集合
    deps: new Set(),
  };
  // 立刻执行一次 建立订阅发布关系
  execute();
}
function cleanup(effect) {
  // 从该 effect 订阅的 所以 state 对应 subs 中 移除 effect
  for (const subs of effect.deps) {
    subs.delete(effect);
  }
  // 将该 effect 依赖的所有 state 对应subs 移除
  effect.deps.clear();
}

function subscribe(effect: effectType, subs: Set<effectType>) {
  // 订阅关系建立
  subs.add(effect);
  // 依赖关系建议
  effect.deps.add(subs);
}

function useMomo<T>(callback): () => T {
  const [s, set] = useState<T>(null);
  // 首次执行 callback 建立回调中 state 的订阅发布关系
  useEffect(() => set(callback()));
  return s;
}

const [name1, setName1] = useState("LILei");
const [name2, setName2] = useState("HanMeiMei");
const [showAll, triggerShowAll] = useState(true);

const whoIsHere = useMomo<string>(() => {
  if (!showAll()) {
    return name1();
  }
  return `${name1()} 和 ${name2()}`;
});
// 打印1：谁在那儿！ LILei 和 HanMeiMei
useEffect(() => {
  console.log("谁在那儿!" + whoIsHere());
});
setName1("XiaoMing");
triggerShowAll(false);
setName2("XiaoHong");
