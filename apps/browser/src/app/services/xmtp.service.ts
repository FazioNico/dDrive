import { Injectable } from '@angular/core';
import {
  Client,
  Conversation,
  ListMessagesOptions,
  Message,
} from '@xmtp/xmtp-js';
import { BehaviorSubject } from 'rxjs';
import { ethers } from 'ethers';

export interface IXMTPMessage {
  conversation?: Conversation;
  messagesInConversation: Message[];
}

export type XMTPConversation = Conversation;
export type XMTPConversationMessage = Message;

@Injectable()
export class XMTPService {
  public readonly messages$: BehaviorSubject<IXMTPMessage[]> =
    new BehaviorSubject<IXMTPMessage[]>([]);
  private _web3Provider!: ethers.providers.Web3Provider;
  private readonly _conversations: BehaviorSubject<Conversation[]> =
    new BehaviorSubject<Conversation[]>([]);
  private readonly _xmtp: BehaviorSubject<Client> = new BehaviorSubject<Client>(
    null as any
  );

  async init(web3Provider: ethers.providers.Web3Provider, opts?: ListMessagesOptions | undefined) {
    this._web3Provider = web3Provider;
    // Create the client with your wallet.
    // This will connect to the XMTP development network by default
    const xmtp = await Client.create(this._web3Provider.getSigner());
    this._xmtp.next(xmtp);
    const {conversations = []} = await this.getConversations();
    this._conversations.next(conversations);
    const messages = await this.getPreviousMessagesFromExistingConverstion(opts);
    this.messages$.next(messages);
    this._listenAllUpcomingMessages();
    return xmtp;
  }

  async disconnect() {
    const xmtp = this._xmtp.getValue();
    if (!xmtp) {
      return;
    }
    await xmtp.close();
  }

  async getConversations() {
    if (!this._web3Provider) {
      throw '{XMTPService} Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    let xmtp = this._xmtp.getValue();
    if (!xmtp) {
      xmtp = await this.init(this._web3Provider);
    }
    const conversations = await xmtp.conversations.list();
    return { conversations };
  }

  async getPreviousMessagesFromExistingConverstion(
    opts?: ListMessagesOptions | undefined
  ) {
    const xmtp = this._xmtp.value;
    const messages = [];
    const conversations = this._conversations.getValue();
    console.log('[INFO] {XMTPService} Conversations', conversations);
    for (const conversation of conversations) {
      // All parameters are optional and can be omitted
      opts = opts
        ? opts
        : {
            // Only show messages from last 24 hours
            startTime: new Date(new Date().setDate(new Date().getDate() - 1)),
            endTime: new Date(),
          };
      // get messages from conversation
      const messagesInConversation = await conversation
        .messages(opts)
        .then((messages) => {
          // filter out messages from self and return
          return messages.filter(
            (message) => message.senderAddress !== xmtp.address
          );
        });
      // add conversation and messages to messages array
      if (messagesInConversation.length > 0) {
        messages.push({
          conversation,
          messagesInConversation,
        });
      }
    };
    console.log('[INFO] {XMTPService} Messages', messages);
    return messages;
  }

  async sendMessage(conversation: Conversation, message: string) {
    if (!this._web3Provider) {
      throw '{XMTPService} Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    await conversation.send(message);
  }

  async startNewConversation(address: string) {
    if (!this._web3Provider) {
      throw '{XMTPService} Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    let xmtp = this._xmtp.getValue();
    if (!xmtp) {
      xmtp = await this.init(this._web3Provider);
    }
    const conversation = await xmtp.conversations
      .newConversation(address)
      .catch((e) => {
        throw e?.message || `Failed to start conversation with ${address}`;
      });
    // this._addListener(conversation);
    this._conversations.next([...this._conversations.getValue(), conversation]);
    return { conversation };
  }

  private async _listenAllUpcomingMessages() {
    if (!this._web3Provider) {
      throw '{XMTPService} Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    const xmtp = this._xmtp.value;
    // Listen for new messages in existing conversations and new conversations
    const streamAllMessages = await xmtp.conversations.streamAllMessages();
    for await (const message of streamAllMessages) {
      // filter out messages from self
      if (message.senderAddress !== xmtp.address) {
        console.log(
          `[INFO] {XMTPService} New message received from ${message.senderAddress}: #${message?.id} ${message?.content}`
        );
        this.messages$.next([
          ...this.messages$.getValue(),
          {
            messagesInConversation: [message]
          }
        ]);
      }
      break;
    }
  }


}
