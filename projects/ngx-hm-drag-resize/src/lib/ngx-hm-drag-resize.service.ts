import { EventEmitter, Injectable, Renderer2 } from '@angular/core';
import { fromEvent, Observable, Subject, empty, BehaviorSubject } from 'rxjs';
import { finalize, switchMap, takeUntil, tap, map } from 'rxjs/operators';

// tslint:disable-next-line:import-blacklist

/**
 * Example
<div #continer style="width: 500px; height:500px; position: absolute; left:50px; top:50px; border:1px solid white">

  <div style="position: relative;">

      <div hm-draggable [hm-draggable-container]="continer"
           hm-resize style="width:200px;height:200px;background:chocolate">
          sdadasd
        </div>
  </div>

</div>
 */

@Injectable({
  providedIn: 'root'
})
export class NgxHmDragResizeService {
  resize$ = new Subject();
  addStyle(
    _renderer: Renderer2,
    elm: HTMLElement,
    style: { [key: string]: string | number } = {}
  ) {
    Object.entries(style).forEach(([key, value]) => {
      _renderer.setStyle(elm, key, value);
    });
  }
}
