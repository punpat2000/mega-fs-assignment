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
	walletConnected = false;
	walletAddress = '0x70670002029dD650EA58c2aC6c58B9DbB85cBd89';
	supplyMode = true;
	modeString = () => (this.supplyMode ? 'Supply' : 'Withdraw');
	supplyApy: Promise<number>;
	totalSupplied: Promise<number>;

	// constructor() {}
	constructor(public cs: ContractService) {
		this.supplyApy = this.cs.getSupplyApyMainnet();
		this.totalSupplied = this.cs.totalSupplyInETH();
	}

	onClickSupply() {
		this.supplyMode = true;
	}

	onClickWithdraw() {
		this.supplyMode = false;
	}

	onClickConnect() {
		if (typeof (window as any).ethereum === 'undefined') {
			console.log('MetaMask has not been installed!');
			return;
		}
	}
}
