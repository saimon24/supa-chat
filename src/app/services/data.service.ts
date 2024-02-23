/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import { SupabaseClient, createClient, RealtimeChannel } from '@supabase/supabase-js';
import { ReplaySubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

const GROUPS_DB = 'groups';
const MESSAGES_DB = 'messages';

export interface Message {
  created_at: string;
  group_id: number;
  id: number;
  text: string;
  user_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private supabase: SupabaseClient;
  private realtimeChannel: RealtimeChannel;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getGroups() {
    return this.supabase
      .from(GROUPS_DB)
      .select(`title,id, users:creator ( email )`)
      .then((result) => result.data);
  }

  async createGroup(title: string) {
    const newgroup = {
      creator: (await this.supabase.auth.getUser()).data.user.id,
      title,
    };

    return this.supabase.from(GROUPS_DB).insert(newgroup).select().single();
  }

  getGroupById(id: string) {
    return this.supabase
      .from(GROUPS_DB)
      .select(`created_at, title, id, users:creator ( email, id )`)
      .match({ id })
      .single()
      .then((result) => result.data);
  }

  async addGroupMessage(groupId: string, message: string) {
    const newMessage = {
      text: message,
      user_id: (await this.supabase.auth.getUser()).data.user.id,
      group_id: groupId,
    };

    console.log('NEW: ', newMessage);

    return this.supabase.from(MESSAGES_DB).insert(newMessage);
  }

  getGroupMessages(groupId: string) {
    // TODO: Limit and sort
    return this.supabase
      .from(MESSAGES_DB)
      .select(`created_at, text, id, users:user_id ( email, id )`)
      .match({ group_id: groupId })
      .then((result) => result.data);
  }

  listenToGroup(groupId: string) {
    const changes = new Subject();

    this.realtimeChannel = this.supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
        console.log('DB CHANGE: ', payload);

        if (payload.new && (payload.new as Message).group_id === +groupId) {
          const msgId = (payload.new as any).id;
          console.log('load message: ', msgId);

          const msg = await this.supabase
            .from(MESSAGES_DB)
            .select(`created_at, text, id, users:user_id ( email, id )`)
            .match({ id: msgId })
            .single()
            .then((result) => result.data);
          changes.next(msg);
        }
      })
      .subscribe();

    return changes.asObservable();
  }

  unsubscribeGroupChanges() {
    if (this.realtimeChannel) {
      console.log('REMOVE CHANNEL');
      this.supabase.removeChannel(this.realtimeChannel);
    }
  }
}
