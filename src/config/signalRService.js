import * as signalR from "@microsoft/signalr";
import { notification } from "antd";
import Cookies from "js-cookie";
import useAuth from "../hooks/useAuth";

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

    // Kết nối cho show hub - cấu hình giống notificationHub
    this.showConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://api.ksms.news/showHub")
      .withAutomaticReconnect()
      .build();

    // Đăng ký callback cho vote updates
    this.voteCallbacks = [];

    // Đăng ký callback cho show status updates
    this.showStatusCallbacks = [];

    // Khi nhận được cập nhật số phiếu
    this.voteConnection.on("ReceiveVoteUpdate", (data) => {
      console.log("Received vote update:", data);
      // Gọi tất cả các callback đã đăng ký
      this.voteCallbacks.forEach((callback) => callback(data));
    });

    // Khi nhận được cập nhật trạng thái show
    this.showConnection.on("ReceiveShowStatusUpdate", (showId, status) => {
      console.log("Received show status update:", showId, status);
      // Gọi tất cả các callback đã đăng ký
      this.showStatusCallbacks.forEach((callback) => callback(showId, status));
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

    // Log cho show connection
    this.showConnection.onreconnecting((error) => {
      console.log("Show SignalR reconnecting:", error);
    });

    this.showConnection.onreconnected((connectionId) => {
      console.log("Show SignalR reconnected. ConnectionId:", connectionId);
    });

    this.showConnection.onclose((error) => {
      console.log("Show SignalR connection closed:", error);
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

    // Lắng nghe sự kiện ForceLogout từ server
    this.connection.on("ForceLogout", (data) => {
      console.log("Force logout received:", data);

      if (!data) return;

      // Hiển thị thông báo với lý do được cung cấp từ server
      notification.error({
        message: "Tài khoản không khả dụng",
        description:
          data.reason ||
          "Tài khoản của bạn không còn khả dụng. Bạn sẽ bị đăng xuất.",
        placement: "topRight",
        duration: 3,
      });

      // Đăng xuất sau 3 giây
      setTimeout(() => {
        const logout = useAuth.getState().logout;
        logout();
        // Chuyển về trang đăng nhập
        window.location.href = "/";
      }, 3000);
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

  async startShowConnection() {
    try {
      if (this.showConnection.state === "Disconnected") {
        console.log("Starting Show SignalR connection...");
        await this.showConnection.start();
        console.log("Show SignalR Connected successfully");
      } else if (this.showConnection.state === "Connected") {
        console.log("Show SignalR already connected, skipping connection");
      } else {
        console.log(
          "Show SignalR connection in state:",
          this.showConnection.state
        );
      }
      return Promise.resolve();
    } catch (err) {
      console.error("Show SignalR Connection Error:", err);
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

  // Đăng ký callback để nhận cập nhật trạng thái show
  subscribeToShowStatusUpdates(callback) {
    this.showStatusCallbacks.push(callback);
    // Trả về hàm để hủy đăng ký
    return () => {
      this.showStatusCallbacks = this.showStatusCallbacks.filter(
        (cb) => cb !== callback
      );
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

  // Hủy kết nối show hub
  async stopShowConnection() {
    if (this.showConnection.state !== "Disconnected") {
      try {
        await this.showConnection.stop();
        console.log("Show SignalR connection stopped");
      } catch (err) {
        console.error("Error stopping show connection:", err);
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

  getShowConnectionState() {
    return this.showConnection.state;
  }
}

export default new SignalRService();
