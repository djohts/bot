import config from "../constants/config";
import mongoose from "mongoose";

export * from "./global";
export * from "./guild";
export * from "./users";

export const connection = mongoose.connect(config.database_uri);