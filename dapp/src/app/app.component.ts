import { ChangeDetectorRef, Component, OnInit, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, take } from 'rxjs';
import { ContractService } from './contract.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ErrorModal } from './modal/error.component';
import { NgbdModalContent } from './modal/modal.component';
@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  inputAmount!: number;
  walletBalance = 0;
  supplyMode = true;
  modeString: 'Supply' | 'Withdraw' = 'Supply';
  supplyApy!: Promise<number>;
  totalSupplied!: Promise<number>;
  receiving = new BehaviorSubject(0);
  totalSuppliedCompound!: Observable<number>;
  yourSupplied!: Observable<number>;
  walletAddress!: Observable<false | string>;
  compoundBalance!: Observable<number>;

  // constructor() {}
  constructor(
    private cs: ContractService,
    private cd: ChangeDetectorRef,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.supplyApy = this.cs.getSupplyApy();
    this.totalSupplied = this.cs.getTotalSupplyInETH();
    this.walletAddress = this.cs.walletAddress.asObservable();
    this.yourSupplied = this.cs.underlyingBalance.asObservable();
    this.compoundBalance = combineLatest([
      this.yourSupplied,
      this.cs.$exchangeRate,
    ]).pipe(
      untilDestroyed(this),
      map((res) => {
        const [amount, rate] = res;
        return amount * rate;
      })
    );
    this.cs.walletBalance.pipe(untilDestroyed(this)).subscribe((val) => {
      this.walletBalance = val;
      this.cd.detectChanges();
    });
  }

  onClickSupply() {
    this.supplyMode = true;
    this.modeString = 'Supply';
    this.triggerInputChange();
  }

  onClickWithdraw() {
    this.supplyMode = false;
    this.modeString = 'Withdraw';
    this.triggerInputChange();
  }

  async onClickConnect() {
    return this.cs.connectWallet();
  }

  beginTransaction() {
    if (!this.inputAmount || this.inputAmount <= 0) {
      const modalRef = this.modalService.open(ErrorModal);
      modalRef.componentInstance.message = 'Illegal input amount!';
      return;
    }

    if (this.supplyMode) {
      this.cs
        .mint(this.inputAmount)
        .then((val) => {
          console.log(val);
          const modalRef = this.modalService.open(NgbdModalContent);
          modalRef.componentInstance.transactionHash =
            val.transactionHash as string;
        })
        .catch((err) => {
          const modalRef = this.modalService.open(ErrorModal);
          modalRef.componentInstance.message = 'User denied transaction :(';
        });
    } else {
      this.cs
        .redeem(this.inputAmount)
        .then((val) => {
          console.log(val);
          const modalRef = this.modalService.open(NgbdModalContent);
          modalRef.componentInstance.transactionHash =
            val.transactionHash as string;
        })
        .catch((err) => {
          const modalRef = this.modalService.open(ErrorModal);
          modalRef.componentInstance.message = 'User denied transaction :(';
        });
    }
  }

  max() {
    if (this.supplyMode) {
      this.inputAmount = this.walletBalance;
    } else {
      this.compoundBalance.pipe(take(1)).subscribe((val) => {
        this.inputAmount = val;
      });
    }
    this.triggerInputChange();
  }

  triggerInputChange() {
    if (this.supplyMode) {
      this.receiving.next(this.inputAmount * this.cs.$exchangeRate.getValue());
    } else {
      this.receiving.next(this.inputAmount / this.cs.$exchangeRate.getValue());
    }
  }
}
