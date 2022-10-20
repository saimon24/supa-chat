import { AuthService } from './../../services/auth.service';
import { DataService } from './../../services/data.service';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(IonContent) content: IonContent;
  group = null;
  messages = [];
  currentUserId = null;
  messageText = '';

  constructor(private route: ActivatedRoute, private data: DataService, private authService: AuthService) {}

  async ngOnInit() {
    const groupid = this.route.snapshot.paramMap.get('groupid');
    this.group = await this.data.getGroupById(groupid);
    this.currentUserId = this.authService.getCurrentUserId();
    this.messages = await this.data.getGroupMessages(groupid);
    this.data.listenToGroup(groupid).subscribe((msg) => {
      console.log('IN res sub: ', msg);
      this.messages.push(msg);
      setTimeout(() => {
        this.content.scrollToBottom(200);
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.content.scrollToBottom(200);
    }, 300);
  }

  loadMessages() {}

  async sendMessage() {
    await this.data.addGroupMessage(this.group.id, this.messageText);
    this.messageText = '';
  }

  ngOnDestroy(): void {
    console.log('Destroy');

    this.data.unsubscribeGroupChanges();
  }
}
