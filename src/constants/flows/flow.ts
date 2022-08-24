import { propertyTypes } from "./propertyTypes";

export const flow = {
    triggers: {
        each: {
            short: "Каждое Х число",
            long: "Когда кто-то считает умножение числа Х. Например, если Х - 10, будет срабатывать на 10, 20, 30 и т.д.",
            properties: [
                propertyTypes.numberX
            ],
            explanation: "Когда кто-то считает умножение {0}",
            check: ({ count }, [number]) => count % number === 0
        },
        only: {
            short: "Только число X",
            long: "Сработает только когда пользователь просчитает число Х.",
            properties: [
                propertyTypes.numberX
            ],
            explanation: "Когда кто-то считает число {0}",
            check: ({ count }, [number]) => count === number
        },
        score: {
            short: "Результат X",
            long: "Сработает как только у кого-либо будет результат Х.",
            properties: [
                propertyTypes.numberX
            ],
            explanation: "Когда кто-нибудь получит результат {0}",
            check: ({ score }, [number]) => score === number
        },
        countfail: {
            short: "Ошибка счёта",
            long: "Сработает когда кто-то сделает ошибку в счёту.",
            explanation: "Когда кто-нибудь посчитает неправильное число",
            check: () => { }
        }
    },
    actions: {
        pin: {
            short: "Закрепить сообщение",
            explanation: "Закрепит сообщение.",
            run: async ({ countingMessage }) => await countingMessage.pin().catch(async () => {
                let pinned = await countingMessage.channel.messages.fetchPinned(false).catch(() => ({ size: 0 }));
                if (pinned.size === 50) await pinned.last().unpin().then(() => countingMessage.pin().catch(() => null)).catch(() => null);
            })
        },
        lock: {
            short: "Заблокировать канал счёта",
            long: "Это сделает канал счёта доступным только для читания.",
            explanation: "Заблокировать канал счёта",
            run: async ({ message: { channel, guild } }) => await channel.updateOverwrite(guild.roles.everyone, { SEND_MESSAGES: false }).catch(() => null)
        },
        reset: {
            short: "Сбросить текущий счёт",
            explanation: "Сбросить счёт до 0",
            run: ({ gdb }) => gdb.set("count", 0)
        }
    }
};

for (const i in flow.triggers) flow.triggers[i] = Object.assign({
    short: "N/A",
    long: null,
    properties: [],
    explanation: "N/A",
    check: (any) => any
}, flow.triggers[i]);

for (const i in flow.actions) flow.actions[i] = Object.assign({
    short: "N/A",
    long: null,
    properties: [],
    explanation: "N/A",
    run: () => null
}, flow.actions[i]);