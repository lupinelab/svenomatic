import axios from "axios";
import * as https from "https";

export class LUCI {
  constructor(host, username, password) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.client = axios.create({
      baseURL: `${this.host}/cgi-bin/luci/rpc`,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  async init() {
    let authParams = JSON.stringify({
      id: 1,
      method: "login",
      params: [this.username, this.password],
    });

    try {
      const tokenRes = await this.client.post("/auth", `${authParams}`);
      this.token = tokenRes.data.result;
    } catch (error) {
      console.log("Authentication failed");
    }
  }

  async getWlanDevices() {
    let params = JSON.stringify({
      id: 1,
      method: "net.devices",
    });

    try {
      const result = await this.client.post(`/sys?auth=${this.token}`, params);

      const entries = result.data.result;
      if (entries == null) {
        throw new Error("Entry not found");
      }

      return entries.filter((device) => device.startsWith("wlan"));
    } catch (e) {
      if (e.message == "Entry not found") {
        console.log(e);
      }
    }
  }

  async getWifiClients(config) {
    let params = JSON.stringify({
      id: 1,
      method: "wifi.getiwinfo",
      params: [config],
    });

    try {
      const result = await this.client.post(`/sys?auth=${this.token}`, params);

      const entries = result.data.result;
      if (entries == null) {
        throw new Error("Entry not found");
      }
      return entries;
    } catch (e) {
      if (e.message == "Entry not found") {
        console.log(e);
      }
    }
  }

  async autoUpdateToken(interval) {
    return setInterval(async () => {
      try {
        console.log(`Old token ${this.token}`);
        await this.init();
        console.log(`New token ${this.token}`);
      } catch (error) {
        console.log("Authentication failed");
      }
    }, interval);
  }
}