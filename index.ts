i/**
 * @name EventManager
 * @description 用于发布/订阅/移除 多个事件 兼容对于同一事件同一回调的多次不同订阅 发布
 */
const genId = function generateSubscribeId(): string { // 生成唯一事件id
  const randomPool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  let randomStringBase: string = '';
  
  randomPool.forEach(() => {
    const randomIndex = Math.floor(Math.random() * randomPool.length);
    randomStringBase += randomPool[randomIndex];
  });

  return new Date().getTime() + randomStringBase;
};

interface IEventBase { // 事件管理实现基础接口
  subscribe(eventName: string | number, callback: () => void): string; // 订阅
  consumeHistory(eventName: string | number, callback: () => void): void; // 历史消费事件，不生成id
  publish(eventName: string | number, payload: any): void; // 发布
  remove(eventName: string, eventId: string): void; // 移除事件
  clear(): void; // 清理所有事件
}

interface ISubscribeItem { // 订阅单元
  eventName: string | number; // 事件名
  callback: (payload: any) => void;
  subscribeId: string; // 订阅者id
}

interface IEventItem { // 事件单元
  eventName: string | number; // 事件名
  payload: any // 事件数据
}

interface IManagerOptions {
  recordHistory: boolean
}

class EventManager implements IEventBase {
  constructor (opts: IManagerOptions) {
    if (opts.recordHistory) {
      this.recordHistory = opts.recordHistory
    }
  }

  private recordHistory: boolean = false; // 是否记录历史 不需要的时候不记录节省内存
  private subscribeQueue: Array<ISubscribeItem> = []; // 订阅者队列
  private historyQueue: Array<IEventItem> = []; // 历史队列（类实例化后，订阅的事件集合）
  
  public consumeHistory = (eventName: string | number | undefined) => {
    if (!this.recordHistory) {
      throw new ReferenceError('未开启历史记录功能，无法获取历史消息')
    }
  }

  public subscribe = (eventName: string | number, callback: (payload: any) => void): string => {
    const subscribeId = genId();
    this.subscribeQueue.push({ subscribeId, eventName, callback });
    return subscribeId;
  }

  public publish = (event: string | number, payload: any): void => { // 发布(订阅者id，事件名均可)
    if (this.recordHistory) {
      this.historyQueue.push({ eventName: event, payload })
    }
    this.subscribeQueue
      .filter((item) => (item.eventName === event) || (item.subscribeId === event))
      .forEach(({ callback }) => callback(payload));
  }

  public remove = (event: string): void => {
    const item = this.subscribeQueue.find((i) => i.subscribeId === event);
    if (item) {
      this.subscribeQueue.splice(this.subscribeQueue.indexOf(item), 1);
    } else {
      this.subscribeQueue = this.subscribeQueue.filter((i) => i.eventName !== event); // 筛选出剩余订阅者
    }
  }

  public clear = (): void => {
    this.subscribeQueue = [];
  }
}

export default EventManager;

