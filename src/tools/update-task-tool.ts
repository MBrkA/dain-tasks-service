import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const updateTaskConfig: ToolConfig = {
  id: "update-task",
  name: "Update Task",
  description: "Updates the specified task",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
    taskId: z.string().describe("Task identifier"),
    title: z.string().optional().describe("New title for the task"),
    notes: z.string().optional().describe("New notes for the task"),
    due: z.string().optional().describe("New due date (RFC 3339 timestamp)"),
    status: z.string().optional().describe("New status (needsAction or completed)"),
  }),
  output: z.object({
    id: z.string(),
    title: z.string(),
    updated: z.string(),
    status: z.string(),
    due: z.string().optional(),
  }).optional(),
  handler: async ({ tasklistId, taskId, ...updates }, agentInfo, { app }) => {
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
        `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task Updated")
        .content(`
          Title: ${response.data.title}
          Status: ${response.data.status}
          Due: ${response.data.due || 'Not set'}
          Updated: ${response.data.updated}
        `)
        .build();

      return {
        text: `Updated task: ${response.data.title}`,
        data: response.data,
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to update task",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
