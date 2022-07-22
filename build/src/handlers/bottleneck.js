"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DMSender = exports.UserFetcher = void 0;
const bottleneck_1 = __importDefault(require("bottleneck"));
exports.UserFetcher = new bottleneck_1.default({
    id: "UserFetcher",
    maxConcurrent: 1,
    minTime: 50,
    reservoir: 1,
    reservoirRefreshAmount: 1,
    reservoirRefreshInterval: 3000
});
exports.DMSender = new bottleneck_1.default({
    id: "DMSender",
    maxConcurrent: 1,
    minTime: 50,
    reservoir: 1,
    reservoirRefreshAmount: 1,
    reservoirRefreshInterval: 3000
});
