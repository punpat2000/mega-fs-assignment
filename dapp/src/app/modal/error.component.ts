import { Input, Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'error-content',
  templateUrl: './error.component.html',
})
export class ErrorModal {
  @Input() message!: string;
  constructor(public activeModal: NgbActiveModal) {}

  close(): void {
    this.activeModal.close('Close click');
    location.reload();
  }
}
