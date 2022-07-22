// TODO: implement handler

import Bottleneck from "bottleneck";

export const UserFetcher = new Bottleneck({
    id: "UserFetcher",
    maxConcurrent: 1,
    minTime: 50,
    reservoir: 1,
    reservoirRefreshAmount: 1,
    reservoirRefreshInterval: 3000
});

export const DMSender = new Bottleneck({
    id: "DMSender",
    maxConcurrent: 1,
    minTime: 50,
    reservoir: 1,
    reservoirRefreshAmount: 1,
    reservoirRefreshInterval: 3000
});