import { Component } from '@angular/core';
import { ContractService } from './contract.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	title = 'Pattradanai Super Compound';
	yourSupplied = 0;
	balance = 1.02;
	receivingCompound = 0;
	supplyMode = true;
	modeString = () => (this.supplyMode ? 'Supply' : 'Withdraw');
	supplyApy: Promise<number>;
	totalSupplied: Promise<number>;
  walletAddress: Promise<string | false>;

	// constructor() {}
	constructor(public cs: ContractService) {
		this.supplyApy = this.cs.getSupplyApy();
		this.totalSupplied = this.cs.totalSupplyInETH();
    this.walletAddress = this.cs.ethEnabled();
	}

	onClickSupply() {
		this.supplyMode = true;
	}

	onClickWithdraw() {
		this.supplyMode = false;
	}

	async onClickConnect() {
		return this.cs.ethEnabled();
	}

	onSubmit() {
		if (!this.cs.connected) {
			console.error('wallet not connected!');
			return;
		}
	}
}
