import { Component, computed, input } from '@angular/core';
import { avatarColor, initials } from '../ui';

@Component({
  selector: 'app-avatar',
  template: `<span class="avatar" [style.background]="color()" [style.width.px]="size()" [style.height.px]="size()"
                   [style.font-size.px]="size() * 0.38">{{ text() }}</span>`
})
export class Avatar {
  name = input<string | null | undefined>('');
  size = input(36);
  text = computed(() => initials(this.name()));
  color = computed(() => avatarColor(this.name()));
}
