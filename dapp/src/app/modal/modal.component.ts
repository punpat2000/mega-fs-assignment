import { Input, Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngbd-modal-content',
  templateUrl: './modal.component.html',
})
export class NgbdModalContent {
  @Input() transactionHash!: string;
  private etherScanUrl = `https://rinkeby.etherscan.io/tx/`;

  constructor(public activeModal: NgbActiveModal) {}

  close(): void {
    this.activeModal.close('Close click');
    location.reload();
  }

  viewEtherScan(): void {
    window.location.href = `${this.etherScanUrl}${this.transactionHash}`;
  }
}
