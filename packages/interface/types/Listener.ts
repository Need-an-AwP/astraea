export type Listener<T> = (data: T) => void;
export type Unsubscribe = () => void;