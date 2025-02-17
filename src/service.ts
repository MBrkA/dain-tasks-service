import { createOAuth2Tool, defineDAINService } from "@dainprotocol/service-sdk";
import { getTokenStore } from "./token-store";
import { listTaskListsConfig } from "./tools/list-tasklists-tool";
import { getTaskListConfig } from "./tools/get-tasklist-tool";
import { createTaskListConfig } from "./tools/create-tasklist-tool";
import { listTasksConfig } from "./tools/list-tasks-tool";

export const dainService = defineDAINService({
  metadata: {
    title: "Google Tasks Service",
    description: "A DAIN service for managing Google Tasks",
    version: "1.0.0",
    author: "DAIN",
    tags: ["tasks", "google", "productivity"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    createOAuth2Tool("google"),
    listTaskListsConfig,
    getTaskListConfig,
    createTaskListConfig,
    listTasksConfig
  ],
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || "http://localhost:2022",
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/tasks",
          "email",
          "profile",
        ],
        onSuccess: async (agentId, tokens) => {
          console.log("Completed OAuth flow for agent", agentId);
          getTokenStore().setToken(agentId, tokens);
          console.log(`Stored tokens for agent ${agentId}`);
        },
      },
    },
  },
});
