import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const deleteTaskConfig: ToolConfig = {
  id: "delete-task",
  name: "Delete Task",
  description: "Deletes the specified task from the task list",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
    taskId: z.string().describe("Task identifier"),
  }),
  output: z.object({}),
  handler: async ({ tasklistId, taskId }, agentInfo, { app }) => {
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
        data: {},
        ui: oauthUI.build(),
      };
    }

    try {
      await axios.delete(
        `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task Deleted")
        .content("The task was successfully deleted")
        .build();

      return {
        text: "Task deleted successfully",
        data: {},
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to delete task",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};
