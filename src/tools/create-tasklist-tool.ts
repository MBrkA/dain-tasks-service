import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const createTaskListConfig: ToolConfig = {
  id: "create-tasklist",
  name: "Create Task List",
  description: "Creates a new task list and adds it to the authenticated user's task lists",
  input: z.object({
    title: z.string().describe("Title of the task list"),
  }),
  output: z.object({
    id: z.string(),
    title: z.string(),
    updated: z.string(),
  }),
  handler: async ({ title }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to access your tasks")
        .logo("https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: null,
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.post(
        `https://tasks.googleapis.com/tasks/v1/users/@me/lists`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task List Created")
        .content(`
          ID: ${response.data.id}
          Title: ${response.data.title}
          Created: ${response.data.updated}
        `)
        .build();

      return {
        text: `Created new task list: ${response.data.title}`,
        data: response.data,
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to create task list",
        data: null,
        ui: alertUI.build(),
      };
    }
  },
};
