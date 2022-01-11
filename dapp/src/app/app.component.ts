import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Pattradanai Super Compound';
  APY = 1.435;
  totalSupplied = 1000;
  yourSupplied = 0;
  balance = 1.02;
  receivingCompound = 0;
  walletConnected = false;
  walletAddress = '0x70670002029dD650EA58c2aC6c58B9DbB85cBd89'
  supplyMode = true;
  modeString = () => this.supplyMode ? 'Supply' : 'Withdraw';

  onClickSupply() {
    this.supplyMode = true;
  }

  onClickWithdraw() {
    this.supplyMode = false;
  }
}
