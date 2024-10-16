'use strict'

const { levels } = require('pino');
const pinoPretty = require('pino-pretty');


function padOrTruncateFactory(length = 10, startChar = '',
    endChar = '',
    options,
    padChar = ' '
) {
    let availableLength = length - startChar.length - endChar.length;

    return function padOrTruncate(
        str
    ) {
        let truncatedStr = str ?? '';
        if (truncatedStr.length > availableLength) {
            if (options?.lenghtAutoResize === true) {
                availableLength = truncatedStr.length;
                length = availableLength + startChar.length + endChar.length;
            } else {
                truncatedStr = truncatedStr.slice(0, availableLength);
            }
        }

        return (startChar + truncatedStr + endChar).padEnd(length, padChar);
    }
}

function pinoPrettyNestjsTransport(opts) {
    const padOrTruncateContext = padOrTruncateFactory(17, '[', ']', { lenghtAutoResize: true });
    const padOrTruncatePid = padOrTruncateFactory(1, '(', ')', { lenghtAutoResize: true });

    opts ??= {};
    opts.levelsLabelsMap = Object.keys(levels.labels).reduce((levelsLabelsMap, level) => {
        levelsLabelsMap[level] = levels.labels[level].toUpperCase();
        return levelsLabelsMap;
    }, {});

    opts.levelsColorMap = {
        trace: 'cyan',
        debug: 'gray',
        info: 'blue',
        warn: 'yellowBright',
        error: 'redBright',
        fatal: 'magenta',
        default: 'blue'
    }

    opts.colorsMap = {
        date: 'white',
        pid: 'greenBright',
        context: 'yellow',
    }

    opts.iconLevels ??= {
        trace: 'ৡ',
        debug: 'ø',
        info: 'ᐅ',
        warn: '۩',
        error: 'ᘿ',
        fatal: 'ᙡ',
        default: '•',
    }

    return pinoPretty({
        ...opts,
        messageFormat(log, messageKey, _levelLabel, { colors }) {
            try {
                const dateMesssage = colors[opts.colorsMap.date](new Date(log.time - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, -1));
                const level = levels.labels[log.level] ?? 'UNK';
                const logColor = colors[opts.levelsColorMap[levels.labels[log.level]]] ?? colors[opts.levelsColorMap.default];
                const pid = colors[opts.colorsMap.pid](`${opts?.showHostName === true ? log.hostname + ':' : ''}${padOrTruncatePid(log.pid)}`);
                const levelMessage = opts?.showLevelLabel === true ? ' | ' + logColor(opts.levelsLabelsMap[log.level] ?? 'UNK') : '';
                const icon = logColor(opts?.iconLevels[level] ?? opts?.iconLevels.default);
                return `${icon} ${dateMesssage} - ${pid} ${colors[opts.colorsMap.context](padOrTruncateContext(log.context))}${levelMessage} ${logColor(log[messageKey])}`;
            } catch (error) {
                // console.error('error', error);
            }
        },
    });
};

module.exports = pinoPrettyNestjsTransport;
module.exports.build = pinoPrettyNestjsTransport;
module.exports.default = pinoPrettyNestjsTransport;
