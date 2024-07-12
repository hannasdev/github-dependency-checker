import { createContainer, asClass, asFunction, asValue } from "awilix";
import { ProgressStorage } from "./progressStorage.js";
import { createLogger } from "./logger.js";
import { createApiClient } from "./api/apiClient.js";
import { createApi } from "./api/api.js";
import { createCache } from "./cache.js";
import * as fileUtils from "./fileUtils.js";
import { createGraphBuilder } from "./graphBuilder.js";
import * as config from "./config.js";

const container = createContainer();

container.register({
  progressStorage: asClass(ProgressStorage).singleton(),
  logger: asFunction(createLogger).singleton(),
  config: asValue(config), // Register config as a value
  apiClient: asFunction(({ logger, config }) =>
    createApiClient(logger, null, config)
  ).singleton(),
  cache: asFunction(createCache).singleton(),
  fileUtils: asValue(fileUtils),
  api: asFunction(createApi).singleton(),
  graphBuilder: asFunction(createGraphBuilder).singleton(),
});

export default container;
