/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { StyleSheet, WebView, AsyncStorage } from 'react-native';

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      myKey: null,
      keypairs: [],
      keypairinuse: "",
    }
    this.webView = null;

    this.getKeyPairs();
    this.getInuseKeyPair();
    // this.gitkis();
  }

  gitkis() {
    this.getAllKeys();
    // this.removeAllKeys();
  }

  async getAllKeys() {
    try {
      const values = await AsyncStorage.getAllKeys();
      console.log(values);
    } catch (error) {
      console.log("all keys" + error);
    }
  }

  async removeAllKeys() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.log("remove allkeys" + error);
    }
  }

  async saveInuseKeyPair(data) {
    try {
      AsyncStorage.setItem('@KeyPair:inuse', data.keypairinuse, () => {
        // this.setState({ keypairinuse: data.keypairinuse });
        AsyncStorage.getItem('@KeyPair:inuse', (value) => {
          this.setState({ keypairinuse: data.keypairinuse });
        }).then(() => {
          this.webView.postMessage(JSON.stringify({
            type: "key_pair_inuse", content: this.state.keypairinuse
          }));
        });;
      })
    } catch (error) {
      console.log("Error saving data" + error);
    }
  }

  async getInuseKeyPair() {
    try {
      const value = await AsyncStorage.getItem('@KeyPair:inuse');
      this.setState({ keypairinuse: value });
    } catch (error) {
      console.log("Error retrieving data" + error);
    }
  }

  async removeInuseKeyPair() {
    try {
      AsyncStorage.removeItem(`@KeyPair:inuse`, () => {
        this.setState({ keypairinuse: "" });
      });
    } catch (error) {
      console.log("Error removing data" + error);
    }
  }

  async saveKeyPair(data) {
    let keyName = data.name;
    keyName = `@${keyName}:keypair`;
    try {
      AsyncStorage.setItem(keyName, JSON.stringify(data), () => {
        AsyncStorage.getAllKeys((err, keys) => {
          const keysFiltered = keys.filter(e => e.indexOf(':keypair') !== -1);
          AsyncStorage.multiGet(keysFiltered, (err, stores) => {
            let tmpStores = [];
            stores.map((result, i, store) => {
              let key = store[i][0];
              let value = store[i][1];
              value = JSON.parse(value);
              tmpStores.push({ name: value.name, privatekey: value.privatekey });
            });
            this.setState({ keypairs: tmpStores });
          }).then(() => {
            this.webView.postMessage(JSON.stringify({
              type: "list_key_pairs", content: this.state.keypairs
            }));
          });
        });
      });
    } catch (error) {
      console.log("Error saving data" + error);
    }
  }

  async getKeyPairs() {
    try {
      AsyncStorage.getAllKeys((err, keys) => {
        const keysFiltered = keys.filter(e => e.indexOf(':keypair') !== -1);
        AsyncStorage.multiGet(keysFiltered, (err, stores) => {
          let tmpStores = [];
          stores.map((result, i, store) => {
            let key = store[i][0];
            let value = store[i][1];
            value = JSON.parse(value);
            tmpStores.push({ name: value.name, privatekey: value.privatekey });
          });
          this.setState({ keypairs: tmpStores });
        });
      });
    }
    catch (error) {
      console.log("Error retrieving data" + error);
    }
  }

  async removeKeyPair(key) {
    const privatekey = this.state.keypairinuse;
    try {
      AsyncStorage.removeItem(`@${key.name}:keypair`, () => {
        if (key.privatekey === privatekey) {
          this.removeInuseKeyPair();
          this.webView.postMessage(JSON.stringify({
            type: "key_pair_inuse", content: ""
          }));
        }
        AsyncStorage.getAllKeys((err, keys) => {
          const keysFiltered = keys.filter(e => e.indexOf(':keypair') !== -1);
          AsyncStorage.multiGet(keysFiltered, (err, stores) => {
            let tmpStores = [];
            stores.map((result, i, store) => {
              let key = store[i][0];
              let value = store[i][1];
              value = JSON.parse(value);
              tmpStores.push({ name: value.name, privatekey: value.privatekey });
            });
            this.setState({ keypairs: tmpStores });
          }).then(() => {
            this.webView.postMessage(JSON.stringify({
              type: "list_key_pairs", content: this.state.keypairs
            }));
          });
        });
      });
    } catch (error) {
      console.log("Error retrieving data" + error);
    }
  }

  onMessage = (event) => {
    // console.log(event.nativeEvent.data);
    const data = JSON.parse(event.nativeEvent.data);

    switch (data.type) {
      case "save_key_pair":
        this.saveKeyPair(data.content);
        break;
      case "inuse_key_pair":
        this.saveInuseKeyPair(data.content);
        break;
      case "remove_key_pair":
        this.removeKeyPair(data.content);
        break;
      default:
        console.log("not in choices");
        break;
    }
  }

  sendData() {
    this.webView.postMessage(JSON.stringify({
      type: "list_key_pairs", content: this.state.keypairs
    }));
    this.webView.postMessage(JSON.stringify({
      type: "key_pair_inuse", content: this.state.keypairinuse
    }));

    setTimeout(() => {
      this.sendData();
    }, 1000);
  }

  onLoadPrivateKey = () => {
    this.sendData();
  }

  render() {
    return (
      <WebView
        style={{ flex: 1 }}
        source={require("./assets/index.html")}
        // source={{ uri: "http://10.0.3.2:3000" }}
        onMessage={(e) => { this.onMessage(e) }}
        ref={(webView) => this.webView = webView}
        onLoad={() => { this.onLoadPrivateKey() }}
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    );
  }
}