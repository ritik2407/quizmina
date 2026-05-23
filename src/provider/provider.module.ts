import { Global, Module } from '@nestjs/common';
import { TokenManager } from './token-manager/token-manager';
import { Hash } from './hash/hash';

@Global()
@Module({
    providers: [
        TokenManager,
        Hash
    ],
    exports: [
        TokenManager,
        Hash
    ]
})
export class ProviderModule { }
