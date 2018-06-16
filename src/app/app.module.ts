import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxHmDragResizeModule } from '../../projects/ngx-hm-drag-resize/src/public_api';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, NgxHmDragResizeModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
