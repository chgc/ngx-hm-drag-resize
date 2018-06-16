import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxHmDraggableDirective } from './ngx-hm-draggable.directive';
import { NgxHmResizableDirective } from './ngx-hm-resizable.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [NgxHmDraggableDirective, NgxHmResizableDirective],
  exports: [NgxHmDraggableDirective, NgxHmResizableDirective]
})
export class NgxHmDragResizeModule {}
