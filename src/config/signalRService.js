import * as signalR from "@microsoft/signalr";
import { notification } from "antd";
import Cookies from "js-cookie";
class SignalRService {
  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5250/notificationHub", {
        accessTokenFactory: () => {
          return Cookies.get("__token") || "";
        },
      })
      .withAutomaticReconnect()
      .build();

    // Thêm log cho các sự kiện kết nối
    this.connection.onreconnecting((error) => {
      console.log("SignalR reconnecting:", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR reconnected. ConnectionId:", connectionId);
    });

    this.connection.onclose((error) => {
      console.log("SignalR connection closed:", error);
    });

    this.connection.on("ReceiveNotification", (data) => {
      console.log("Received notification data:", data);

      // Kiểm tra dữ liệu nhận được
      if (!data) {
        console.error("Received empty notification data");
        return;
      }

      try {
        notification.info({
          message: data.Title || "Thông báo mới",
          description: data.Message || data.message,
          placement: "topRight",
          duration: 4.5,
        });
        console.log("Notification displayed successfully");
      } catch (error) {
        console.error("Error displaying notification:", error);
      }
    });
  }

  async start() {
    try {
      if (this.connection.state === "Disconnected") {
        console.log("Starting SignalR connection...");
        await this.connection.start();
        // console.log(
        //   "SignalR Connected successfully. Connection state:",
        //   this.connection.state
        // );
      } else {
        // console.log(
        //   "SignalR already connected. Current state:",
        //   this.connection.state
        // );
      }
      return Promise.resolve();
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      return Promise.reject(err);
    }
  }

  // Thêm phương thức để kiểm tra trạng thái kết nối
  getConnectionState() {
    return this.connection.state;
  }
}

export default new SignalRService();
