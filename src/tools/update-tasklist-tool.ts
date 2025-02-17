import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const updateTaskListConfig: ToolConfig = {
  id: "update-tasklist",
  name: "Update Task List",
  description: "Updates the authenticated user's specified task list",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
    title: z.string().describe("New title for the task list"),
  }),
  output: z.object({
    id: z.string(),
    title: z.string(),
    updated: z.string(),
  }).optional(),
  handler: async ({ tasklistId, title }, agentInfo, { app }) => {
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
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.patch(
        `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${tasklistId}`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task List Updated")
        .content(`
          ID: ${response.data.id}
          Title: ${response.data.title}
          Last Updated: ${response.data.updated}
        `)
        .build();

      return {
        text: `Updated task list: ${response.data.title}`,
        data: response.data,
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to update task list",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
