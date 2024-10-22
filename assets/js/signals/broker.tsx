import React from "react";

export class LocalSignalBroker {
  static __instance: LocalSignalBroker | null = null;
  subscribers: Record<string, Function[]>;

  static init() {
    if (LocalSignalBroker.__instance === null) {
      LocalSignalBroker.__instance = new LocalSignalBroker();
    }

    return LocalSignalBroker.__instance;
  }

  static getInstance() {
    if (LocalSignalBroker.__instance === null) {
      throw new Error("LocalSignalBroker is not initialized");
    }

    return LocalSignalBroker.__instance;
  }

  constructor() {
    this.subscribers = {};
  }

  subscribe(event: string, callback: Function) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }

    this.subscribers[event]!.push(callback);
  }

  unsubscribe(event: string, callback: Function) {
    if (!this.subscribers[event]) return;

    this.subscribers[event] = this.subscribers[event]!.filter((cb) => cb !== callback);
  }

  publish(event: string) {
    if (!this.subscribers[event]) return;

    this.subscribers[event]!.forEach((cb) => cb());
  }
}

export function useSubscription(event: string, callback: () => void) {
  const broker = LocalSignalBroker.getInstance();

  React.useEffect(() => {
    broker.subscribe(event, callback);

    return () => {
      broker.unsubscribe(event, callback);
    };
  }, [event, callback]);
}

export function init() {
  LocalSignalBroker.init();
}

export function publish(event: string) {
  LocalSignalBroker.getInstance().publish(event);
}
