export const modules = {
    "allow-spam": {
        short: "Позволяет пользователям считать несколько раз подряд.",
        image: "https://i.promise.solutions/ISe9n5.gif"
    },
    embed: {
        short: "Репостит сообщение в эмбеде.",
        incompatible: [
            "webhook"
        ],
        image: "https://i.promise.solutions/uM2pPX.gif"
    },
    talking: {
        short: "Позволяет пользователям писать текст после числа.",
        image: "https://i.promise.solutions/uTpoA9.gif"
    },
    webhook: {
        short: "Репостит сообщение вебхуком.",
        incompatible: [
            "embed"
        ],
        image: "https://i.promise.solutions/vTQhyU.gif"
    }
};

for (const i in modules) modules[i] = Object.assign({
    short: "N/A",
    long: null,
    image: null,
    incompatible: []
}, modules[i]);