import * as signalR from "@microsoft/signalr";
import { notification } from "antd";
import Cookies from "js-cookie";

class SignalRService {
  constructor() {
    // Kết nối cho notification
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://api.ksms.news/notificationHub", {
        accessTokenFactory: () => {
          return Cookies.get("__token") || "";
        },
      })
      .withAutomaticReconnect()
      .build();

    // Kết nối cho vote hub - cấu hình giống notificationHub
    this.voteConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://api.ksms.news/voteHub")
      .withAutomaticReconnect()
      .build();

    // Đăng ký callback cho vote updates
    this.voteCallbacks = [];

    // Khi nhận được cập nhật số phiếu
    this.voteConnection.on("ReceiveVoteUpdate", (data) => {
      console.log("Received vote update:", data);
      // Gọi tất cả các callback đã đăng ký
      this.voteCallbacks.forEach((callback) => callback(data));
    });

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

    // Log cho vote connection
    this.voteConnection.onreconnecting((error) => {
      console.log("Vote SignalR reconnecting:", error);
    });

    this.voteConnection.onreconnected((connectionId) => {
      console.log("Vote SignalR reconnected. ConnectionId:", connectionId);
    });

    this.voteConnection.onclose((error) => {
      console.log("Vote SignalR connection closed:", error);
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

  async startVoteConnection() {
    try {
      if (this.voteConnection.state === "Disconnected") {
        console.log("Starting Vote SignalR connection...");
        await this.voteConnection.start();
        console.log("Vote SignalR Connected successfully");
      }
      return Promise.resolve();
    } catch (err) {
      console.error("Vote SignalR Connection Error:", err);
      return Promise.reject(err);
    }
  }

  // Đăng ký callback để nhận cập nhật số phiếu
  subscribeToVoteUpdates(callback) {
    this.voteCallbacks.push(callback);
    // Trả về hàm để hủy đăng ký
    return () => {
      this.voteCallbacks = this.voteCallbacks.filter((cb) => cb !== callback);
    };
  }

  // Hủy kết nối vote hub
  async stopVoteConnection() {
    if (this.voteConnection.state !== "Disconnected") {
      try {
        await this.voteConnection.stop();
        console.log("Vote SignalR connection stopped");
      } catch (err) {
        console.error("Error stopping vote connection:", err);
      }
    }
  }

  // Kiểm tra trạng thái kết nối
  getConnectionState() {
    return this.connection.state;
  }

  getVoteConnectionState() {
    return this.voteConnection.state;
  }
}

export default new SignalRService();
