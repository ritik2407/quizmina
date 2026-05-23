import * as winston from 'winston';
import type { TransformableInfo } from 'logform';
import 'winston-daily-rotate-file';

const DailyRotateFile = (winston.transports as unknown as {
    DailyRotateFile: new (opts: Record<string, unknown>) => winston.transport;
}).DailyRotateFile;

const formatPrintf = winston.format.printf(
    ({
        timestamp,
        level,
        message,
        context,
    }: {
        timestamp: string;
        level: string;
        message: string;
        context: string;
    }) => {
        return `[${timestamp}] [${level}]${context ? ' [' + context + ']' : ''} ${message}`;
    },
);

export const createLoggerConfig = () => ({
    transports: [
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'error-%DATE%.log',
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'error.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                formatPrintf,
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'logs-%DATE%.log',
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'logs.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                formatPrintf,
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'innovalon-%DATE%.log',
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'innovalon.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format((info) => {
                    return info.context === 'inovalon' ? info : false;
                })(),
                formatPrintf,
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'twilio-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'twilio.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format((info: TransformableInfo) => {
                    const context = typeof info.context === 'string' ? info.context.toLowerCase() : '';
                    return context === 'twilio' ? info : false;
                })(),
                formatPrintf,
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'stripe-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'stripe.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format((info: TransformableInfo) => {
                    const context = typeof info.context === 'string' ? info.context.toLowerCase() : '';
                    return context === 'stripe' ? info : false;
                })(),
                formatPrintf,
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'frontend-%DATE%.log',
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'frontend.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format((info: TransformableInfo) => {
                    const context = typeof info.context === 'string' ? info.context.toLowerCase() : '';
                    return context === 'frontend' ? info : false;
                })(),
                formatPrintf,
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'open-floor-%DATE%.log',
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            createSymlink: true,
            symlinkName: 'open-floor.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format((info: TransformableInfo) => {
                    const context = typeof info.context === 'string' ? info.context.toLowerCase() : '';
                    return context === 'open-floor' ? info : false;
                })(),
                formatPrintf,
            ),
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format((info: TransformableInfo) => {
                    const context = typeof info.context === 'string' ? info.context.toLowerCase() : '';
                    return context === 'open-floor' ? false : info;
                })(),
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                formatPrintf,
            ),
        }),
    ],
});
