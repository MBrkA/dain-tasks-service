import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const getTaskListConfig: ToolConfig = {
  id: "get-tasklist",
  name: "Get Task List",
  description: "Returns the authenticated user's specified task list",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
  }),
  output: z.object({
    id: z.string(),
    title: z.string(),
    updated: z.string(),
  }),
  handler: async ({ tasklistId }, agentInfo, { app }) => {
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
      const response = await axios.get(
        `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${tasklistId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task List Details")
        .content(`
          ID: ${response.data.id}
          Title: ${response.data.title}
          Last Updated: ${response.data.updated}
        `)
        .build();

      return {
        text: `Retrieved task list: ${response.data.title}`,
        data: response.data,
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to fetch task list",
        data: null,
        ui: alertUI.build(),
      };
    }
  },
};
