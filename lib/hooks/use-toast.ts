'use client'

import * as React from "react"
import type { ToasterProps, ToastT } from "sonner"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastT & {
    id: string
}

const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

type ActionType = typeof actionTypes

type Action =
    | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
    | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> & { id: string } }
    | { type: ActionType["DISMISS_TOAST"]; toastId?: string }
    | { type: ActionType["REMOVE_TOAST"]; toastId?: string }

interface State {
    toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, dispatch: (action: Action) => void) => {
    if (toastTimeouts.has(toastId)) return

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId)
        dispatch({ type: "REMOVE_TOAST", toastId })
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            }

        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            }

        case "DISMISS_TOAST": {
            if (action.toastId) addToRemoveQueue(action.toastId, dispatch)
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    action.toastId === undefined || t.id === action.toastId
                        ? { ...t, open: false }
                        : t
                ),
            }
        }

        case "REMOVE_TOAST":
            if (!action.toastId) return { ...state, toasts: [] }
            return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
    }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => listener(memoryState))
}

function toastInternal(props: Omit<ToasterToast, "id">) {
    const id = genId()

    const update = (newProps: Partial<ToasterToast>) =>
        dispatch({ type: "UPDATE_TOAST", toast: { ...newProps, id } })

    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
        },
    })

    return { id, dismiss, update }
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) listeners.splice(index, 1)
        }
    }, [])

    return {
        ...state,
        toast: toastInternal,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    }
}

export { useToast, toastInternal }
