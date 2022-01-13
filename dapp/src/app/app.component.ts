import { Component } from '@angular/core';
import { ContractService } from './contract.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = `Pattradanai's Simple Compound`;
  yourSupplied = 0;
  walletBalance = 0;
  receivingCompound = 0;
  supplyMode = true;
  modeString = () => (this.supplyMode ? 'Supply' : 'Withdraw');
  supplyApy: Promise<number>;
  totalSupplied: Promise<number>;
  walletAddress: false | string = false;
  inputAmount: number = 0;

  // constructor() {}
  constructor(private cs: ContractService) {
    this.supplyApy = this.cs.getSupplyApy();
    this.totalSupplied = this.cs.totalSupplyInETH();
    this.cs.walletAddress.asObservable().subscribe((val) => {
      this.walletAddress = val;
    });
    this.cs.walletBalance.asObservable().subscribe((val) => {
      this.walletBalance = val;
    });
    this.cs.underlyingBalance.asObservable().subscribe((val) => {
      this.yourSupplied = val;
    });
  }

  onClickSupply() {
    this.supplyMode = true;
  }

  onClickWithdraw() {
    this.supplyMode = false;
  }

  async onClickConnect() {
    return this.cs.connectWallet();
  }

  async onSubmit() {
    await this.cs.mint();
  }

  max() {
    this.inputAmount = this.walletBalance;
  }
}
