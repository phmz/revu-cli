import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.printf((info) => {
          return `${info.message}`;
        }),
      ),
    }),
  ],
});
