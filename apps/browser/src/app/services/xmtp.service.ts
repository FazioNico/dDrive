import { Injectable } from '@angular/core';
import {
  Client,
  Conversation,
  ListMessagesOptions,
  Message,
} from '@xmtp/xmtp-js';
import { BehaviorSubject } from 'rxjs';
import { ethers } from 'ethers';

interface IXMTPMessage {
  conversation: Conversation;
  messagesInConversation: Message[];
}

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

  async init(web3Provider: ethers.providers.Web3Provider) {
    this._web3Provider = web3Provider;
    // Create the client with your wallet.
    // This will connect to the XMTP development network by default
    const xmtp = await Client.create(this._web3Provider.getSigner());
    this._xmtp.next(xmtp);
    await this.getConversations();
    await this.getPreviousMessagesFromExistingConverstion();
    this._listenAllMessages();
    return xmtp;
  }

  async getConversations() {
    if (!this._web3Provider) {
      throw 'Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    let xmtp = this._xmtp.getValue();
    if (!xmtp) {
      xmtp = await this.init(this._web3Provider);
    }
    const conversations = await xmtp.conversations.list();
    this._conversations.next(conversations);
    return { conversations };
  }

  async getPreviousMessagesFromExistingConverstion(
    opts?: ListMessagesOptions | undefined
  ) {
    const xmtp = this._xmtp.value;
    const messages = [];
    const conversations = this._conversations.getValue();
    console.log('[INFO][XMTP] Conversations', conversations);
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
        })
        .then((messages) => 
          // parse messages to display notifiaction of shared files
          messages.map((message) => this._parseMessage(message))
        );
      // add conversation and messages to messages array
      messages.push({
        conversation,
        messagesInConversation,
      });
    }
    // update messages$ BehaviorSubject
    this.messages$.next(messages);
    console.log('[INFO][XMTP] Messages', messages);
    return messages;
  }

  async sendMessage(conversation: Conversation, message: string) {
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
    const conversation = await xmtp.conversations
      .newConversation(address)
      .catch((e) => {
        throw e?.message || `Failed to start conversation with ${address}`;
      });
    // this._addListener(conversation);
    this._conversations.next([...this._conversations.getValue(), conversation]);
    return { conversation };
  }

  // TODO: add to message to message BehaviorSubject
  private async _listenAllMessages() {
    if (!this._web3Provider) {
      throw 'Web3Provider not found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    const xmtp = this._xmtp.value;
    // Listen for new messages in existing conversations and new conversations
    const streamAllMessages = await xmtp.conversations.streamAllMessages();
    for await (const message of streamAllMessages) {
      // filter out messages from self
      if (message.senderAddress !== xmtp.address) {
        console.log(
          `[INFO][XMTP] New message received from ${message.senderAddress}: #${message?.id} ${message?.content}`
        );
        const parsedMessage = this._parseMessage(message);
        console.log('[INFO][XMTP] Parsed message', parsedMessage);
        
      }
      break;
    }
  }

  private _parseMessage(message: Message) {
    return message;
  }
}
