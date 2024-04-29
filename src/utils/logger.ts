enum LogType {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
}

const colorizeLog = (message: string, type: LogType): string => {
    let color: string;
    switch (type) {
        case LogType.INFO:
            color = '\x1b[36m'; // Cyan
            break;
        case LogType.WARN:
            color = '\x1b[33m'; // Yellow
            break;
        case LogType.ERROR:
            color = '\x1b[31m'; // Red
            break;
        case LogType.DEBUG:
            color = '\u001B[1m'; // Bold
            break;
        default:
            color = '\x1b[0m'; // Reset
    }
    return `${color}${message}\x1b[0m`; // Reset color after message
}

const coloredInfo = (message: string, sender: string = "bot"): void => {
    console.info(colorizeLog(`[${sender.toUpperCase()}]::: ${message}`, LogType.INFO));
}

const coloredWarn = (message: string, sender: string = "bot"): void => {
    console.warn(colorizeLog(`[${sender.toUpperCase()}]::: ${message}`, LogType.WARN));
}

const coloredError = (message: string, sender: string = "bot"): void => {
    console.error(colorizeLog(`[${sender.toUpperCase()}]::: ${message}`, LogType.ERROR));
}

const coloredDebug = (message: string, sender: string = "bot"): void => {
    console.error(colorizeLog(`[${sender.toUpperCase()}]::: ${message}`, LogType.DEBUG));
}

export { coloredInfo, coloredWarn, coloredError, coloredDebug }