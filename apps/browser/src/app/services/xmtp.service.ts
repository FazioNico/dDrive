import { Injectable } from "@angular/core";
import { Client, Conversation } from '@xmtp/xmtp-js'
import { BehaviorSubject } from "rxjs";
import { ethers } from 'ethers'

@Injectable()
export class XMTPService {

  private _web3Provider!: ethers.providers.Web3Provider;
  private readonly _conversations: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private readonly _xmtp: BehaviorSubject<Client> = new BehaviorSubject<Client>(null as any);
  
  async init(web3Provider: ethers.providers.Web3Provider) {
    this._web3Provider = web3Provider;
    // Create the client with your wallet. 
    // This will connect to the XMTP development network by default
    const xmtp = await Client.create(this._web3Provider.getSigner());
    this._xmtp.next(xmtp);
    this._listen();
    return xmtp;
  }

  async getConversations() { 
    if (!this._web3Provider) {
      throw 'Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    let xmtp = this._xmtp.getValue();
    if (!xmtp ) {
      xmtp = await this.init(this._web3Provider);
    }
    const conversations = await xmtp.conversations.list();
    this._conversations.next(conversations);
    return {conversations};
  }

  async sendMessage(conversation:Conversation, message: string) {
    if (!this._web3Provider) {
      throw 'Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    await conversation.send(message);
  }

  async startNewConversation(address: string) {
    if (!this._web3Provider) {
      throw 'Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    let xmtp = this._xmtp.getValue();
    if (!xmtp) {
      xmtp = await this.init(this._web3Provider);
    }
    const conversation = await xmtp.conversations.newConversation(
      address
    ).catch((e) => {
      throw e?.message||`Failed to start conversation with ${address}`
    });
    this._addListener(conversation);
    this._conversations.next([...this._conversations.getValue(), conversation]);
    return {conversation};
  }

  private async _listen() {
    if (!this._web3Provider) {
      throw 'Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    const xmtp = this._xmtp.value;
    // Listen for new conversations
    const stream = await xmtp.conversations.stream();
    for await (const conversation of stream) {
      console.log(`New conversation started with ${conversation?.peerAddress}: ${conversation?.messages({
        limit: 10
      })}`)
      // Say hello to your new friend
      await conversation.send('Hi there!');
      // Break from the loop to stop listening
      break
    };
  }

  private async _addListener(conversation: Conversation) {
    for await (const message of await conversation.streamMessages()) {
      console.log(`[${message.senderAddress}]: ${message.content}`)
    }
  }

}